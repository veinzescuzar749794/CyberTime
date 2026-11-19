import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import pg from 'pg';
import connectPg from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if(process.env.NODE_ENV==='production'&&!process.env.SESSION_SECRET)throw new Error('SESSION_SECRET must be set in production');
const app=express(); const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.PGSSL==='true'?{rejectUnauthorized:false}:undefined});
const PgStore=connectPg(session);
app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173',credentials:true})); app.use(express.json());
app.use(session({store:new PgStore({pool,createTableIfMissing:true}),secret:process.env.SESSION_SECRET||'local-development-secret-change-me',resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:8*60*60*1000}}));
const roles=['PATRON','CASHIER','ADMIN'];
const safe=u=>({id:u.id,username:u.username,studentId:u.student_id,role:u.role,balance:Number(u.balance)});
const auth=(req,res,next)=>req.session.user?next():res.status(401).json({error:'Please sign in to continue.'});
const allow=(...r)=>(req,res,next)=>r.includes(req.session.user?.role)?next():res.status(403).json({error:'You do not have access to this action.'});
app.get('/api/health',(_,res)=>res.json({ok:true}));
app.post('/api/auth/login',async(req,res)=>{try{const {identifier,password}=req.body||{};if(!identifier||!password)return res.status(400).json({error:'Enter your username or student ID and password.'});const {rows}=await pool.query('SELECT * FROM users WHERE lower(username)=lower($1) OR lower(student_id)=lower($1) LIMIT 1',[identifier.trim()]);const u=rows[0];if(!u||!await bcrypt.compare(password,u.password_hash))return res.status(401).json({error:'Invalid username/student ID or password.'});req.session.regenerate(err=>{if(err)return res.status(500).json({error:'Could not establish a secure session.'});req.session.user=safe(u);req.session.save(err=>{if(err)return res.status(500).json({error:'Could not establish a secure session.'});res.json({user:req.session.user})})});}catch(e){console.error(e);res.status(500).json({error:'Could not sign in.'})}});
app.post('/api/auth/logout',auth,(req,res)=>req.session.destroy(e=>{if(e)return res.status(500).json({error:'Could not sign out.'});res.clearCookie('connect.sid');res.json({ok:true})}));
app.get('/api/auth/me',auth,(req,res)=>res.json({user:req.session.user}));
app.post('/api/users',auth,allow('CASHIER','ADMIN'),async(req,res)=>{const {username,studentId,password,initialDeposit=0,role='PATRON'}=req.body||{};const deposit=Number(initialDeposit);if(!username||username.trim().length<3||!password||password.length<8||!Number.isFinite(deposit)||deposit<0||!roles.includes(role))return res.status(400).json({error:'Provide a username (3+ characters), password (8+ characters), valid role, and non-negative initial deposit.'});if(role==='ADMIN'&&req.session.user.role!=='ADMIN')return res.status(403).json({error:'Only an admin can create another admin.'});if(role!=='PATRON'&&deposit!==0)return res.status(400).json({error:'Staff accounts cannot receive a patron balance.'});const c=await pool.connect();try{const hash=await bcrypt.hash(password,12);await c.query('BEGIN');const {rows}=await c.query('INSERT INTO users(username,student_id,password_hash,role,balance) VALUES($1,$2,$3,$4,$5) RETURNING *',[username.trim(),studentId?.trim()||null,hash,role,deposit]);const u=rows[0];if(deposit>0)await c.query("INSERT INTO transactions(user_id,amount,payment_method,created_by) VALUES($1,$2,'CASH',$3)",[u.id,deposit,req.session.user.id]);await c.query('COMMIT');res.status(201).json({user:safe(u)});}catch(e){await c.query('ROLLBACK');if(e.code==='23505')return res.status(409).json({error:'That username or student ID is already registered.'});console.error(e);res.status(500).json({error:'Could not create account.'})}finally{c.release()}});
app.get('/api/users',auth,allow('CASHIER','ADMIN'),async(_,res)=>{try{const {rows}=await pool.query("SELECT id,username,student_id,role,balance,created_at FROM users ORDER BY created_at DESC");res.json({users:rows.map(safe)})}catch(e){console.error(e);res.status(500).json({error:'Could not load accounts.'})}});
app.post('/api/users/:id/topups',auth,allow('CASHIER','ADMIN'),async(req,res)=>{const amount=Number(req.body?.amount);if(!Number.isFinite(amount)||amount<=0)return res.status(400).json({error:'Enter a top-up amount greater than zero.'});const c=await pool.connect();try{await c.query('BEGIN');const result=await c.query("UPDATE users SET balance=balance+$1 WHERE id=$2 AND role='PATRON' RETURNING *",[amount,req.params.id]);if(!result.rowCount){await c.query('ROLLBACK');return res.status(404).json({error:'Patron account not found.'})}await c.query("INSERT INTO transactions(user_id,amount,payment_method,created_by) VALUES($1,$2,'CASH',$3)",[req.params.id,amount,req.session.user.id]);await c.query('COMMIT');res.json({user:safe(result.rows[0])})}catch(e){await c.query('ROLLBACK');console.error(e);res.status(500).json({error:'Top-up failed.'})}finally{c.release()}});
const __dirname=path.dirname(fileURLToPath(import.meta.url)); if(process.env.NODE_ENV==='production'){app.use(express.static(path.join(__dirname,'../dist')));app.get('*',(_,res)=>res.sendFile(path.join(__dirname,'../dist/index.html')))}
const port=Number(process.env.PORT)||8080; app.listen(port,()=>console.log(`CyberTime API listening on ${port}`));
