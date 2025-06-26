import Button from "../common/basic/Button";

/**
 * @deprecated ReviewSubmitButton은 통합 Button 컴포넌트로 대체되었습니다.
 * Button 컴포넌트에 variant="submit"을 사용하세요.
 */
export default function ReviewSubmitButton({ className, disabled, onClick }) {
  return (
    <div className={className}>
      <Button
        variant="submit"
        size="large"
        disabled={disabled}
        onClick={onClick}
      >
        등록하기
      </Button>
    </div>
  );
}
