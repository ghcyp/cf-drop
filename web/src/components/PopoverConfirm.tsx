import { memo, useEffect, useRef, useState } from "react";

export const PopoverConfirm = memo(({ children, onConfirm }: { children: React.ReactNode, onConfirm: () => void }) => {
  const [visible, setVisible] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = visible && confirmBtnRef.current;
    if (!el) return;

    const onBlur = () => {
      setVisible(false);
    }
    el.addEventListener('blur', onBlur);
    el.focus();

    return () => el.removeEventListener('blur', onBlur);
  }, [visible])

  return (
    <div className="relative">
      <div onClick={() => setVisible(true)}>{children}</div>

      {
        visible && (<div className="absolute right-0 bottom-full z-10 rounded shadow p-4 bg-white flex gap-2 b-2 b-solid b-red-9 mb-4">
          <button className="btn-gray" onClick={() => setVisible(false)}>No</button>
          <button className="btn" onClick={onConfirm} ref={confirmBtnRef}>Yes</button>
          <div className="b-8 b-solid b-transparent b-t-red-9 absolute bottom-[-16px] right-4 w-0 h-0"></div>
        </div>)
      }
    </div>
  )
})