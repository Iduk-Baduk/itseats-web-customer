import Button from "./Button";

/**
 * @deprecated LineButton은 통합 Button 컴포넌트로 대체되었습니다.
 * Button 컴포넌트에 variant="line"을 사용하세요.
 */
export default function LineButton({ children, onClick, className = "", disabled = false, ...props }) {
  return (
    <Button 
      variant="line" 
      onClick={onClick} 
      className={className} 
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}
