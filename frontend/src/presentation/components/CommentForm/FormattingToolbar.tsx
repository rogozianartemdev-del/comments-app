interface Props {
    onInsert: (open: string, close: string) => void;
  }
  
  const BUTTONS: { label: string; open: string; close: string }[] = [
    { label: 'i', open: '<i>', close: '</i>' },
    { label: 'strong', open: '<strong>', close: '</strong>' },
    { label: 'code', open: '<code>', close: '</code>' },
    { label: 'a', open: '<a href="" title="">', close: '</a>' },
  ];
  
  export function FormattingToolbar({ onInsert }: Props) {
    return (
      <div className="formatting-toolbar">
        {BUTTONS.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={() => onInsert(btn.open, btn.close)}
          >
            [{btn.label}]
          </button>
        ))}
      </div>
    );
  }