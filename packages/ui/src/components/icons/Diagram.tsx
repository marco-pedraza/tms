export interface DiagramProps {
  className?: string;
}

function Diagram({ className }: DiagramProps) {
  return (
    <svg
      width="24.13"
      height="24.13"
      viewBox="0 0 24.13 24.13"
      className={className}
    >
      <g id="c">
        <rect width="24.13" height="24.13" fill="none" />
        <path
          d="M9.06,13.06h-5c-1.1,0-2-.9-2-2v-7c0-1.1.9-2,2-2h5c1.1,0,2,.9,2,2v7c0,1.1-.9,2-2,2ZM4.06,4.06h0v7h5v-7h-5Z"
          fill="#00491F"
        />
        <path
          d="M20.06,9.06h-5c-1.1,0-2-.9-2-2v-3c0-1.1.9-2,2-2h5c1.1,0,2,.9,2,2v3c0,1.1-.9,2-2,2ZM15.06,4.06h0v3h5v-3h-5Z"
          fill="#FF6800"
        />
        <path
          d="M20.06,22.06h-5c-1.1,0-2-.9-2-2v-7c0-1.1.9-2,2-2h5c1.1,0,2,.9,2,2v7c0,1.1-.9,2-2,2ZM15.06,13.06h0v7h5v-7h-5Z"
          fill="#00491F"
        />
        <path
          d="M9.06,22.06h-5c-1.1,0-2-.9-2-2v-3c0-1.1.9-2,2-2h5c1.1,0,2,.9,2,2v3c0,1.1-.9,2-2,2ZM4.06,17.06h0v3h5v-3h-5Z"
          fill="#FF6800"
        />
      </g>
    </svg>
  );
}

export default Diagram;
