export function ErrorMessage({ children, onClose }) {
  if (!children) return null;
  return <div className="alert inline">{children}{onClose&&<button onClick={onClose}>×</button>}</div>;
}
export function SuccessMessage({ children, onClose }) {
  if (!children) return null;
  return <div className="success">{children}<button onClick={onClose}>×</button></div>;
}
