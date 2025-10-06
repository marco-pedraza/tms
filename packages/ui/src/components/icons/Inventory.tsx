export interface InventoryProps {
  className?: string;
}

function Inventory({ className }: InventoryProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={className}>
      <g id="c">
        <path d="M0,0h24v24H0V0Z" fill="none" />
        <path
          d="M17,4h-1.18c-.41-1.16-1.51-2-2.82-2h-2c-1.3,0-2.4.84-2.82,2h-1.18c-1.65,0-3,1.35-3,3v12c0,1.65,1.35,3,3,3h10c1.65,0,3-1.35,3-3V7c0-1.65-1.35-3-3-3ZM11,4h2c.55,0,1,.45,1,1s-.45,1-1,1h-2c-.55,0-1-.45-1-1s.45-1,1-1ZM18,19c0,.55-.45,1-1,1H7c-.55,0-1-.45-1-1V7c0-.55.45-1,1-1h1.18c.41,1.16,1.51,2,2.82,2h2c1.3,0,2.4-.84,2.82-2h1.18c.55,0,1,.45,1,1v12Z"
          fill="#00491f"
        />
        <path
          d="M12,18c-.55,0-1-.45-1-1v-1c0-.55.45-1,1-1s1,.45,1,1v1c0,.55-.45,1-1,1Z"
          fill="#ff6800"
        />
        <path
          d="M9,12c-.55,0-1,.45-1,1v4c0,.55.45,1,1,1s1-.45,1-1v-4c0-.55-.45-1-1-1Z"
          fill="#ff6800"
        />
        <path
          d="M15,14c-.55,0-1,.45-1,1v2c0,.55.45,1,1,1s1-.45,1-1v-2c0-.55-.45-1-1-1Z"
          fill="#ff6800"
        />
        <path
          d="M12,15c-.55,0-1,.45-1,1v1c0,.55.45,1,1,1s1-.45,1-1v-1c0-.55-.45-1-1-1Z"
          fill="#ff6800"
        />
      </g>
    </svg>
  );
}

export default Inventory;
