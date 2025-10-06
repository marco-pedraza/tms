export interface DashboardProps {
  className?: string;
}

function Dashboard({ className }: DashboardProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={className}>
      <g id="c">
        <path d="M0,0h24v24H0V0Z" fill="none" />
        <path
          d="M20,3H4c-1.1,0-2,.9-2,2v10c0,1.1.9,2,2,2h4v2h-1c-.55,0-1,.45-1,1s.45,1,1,1h10c.55,0,1-.45,1-1s-.45-1-1-1h-1v-2h4c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM10,19v-2h4v2h-4ZM20,15H4V5h16v10Z"
          fill="#00491f"
        />
        <path
          d="M12,13c-.55,0-1-.45-1-1v-1c0-.55.45-1,1-1s1,.45,1,1v1c0,.55-.45,1-1,1Z"
          fill="#ff6800"
        />
        <path
          d="M9,7c-.55,0-1,.45-1,1v4c0,.55.45,1,1,1s1-.45,1-1v-4c0-.55-.45-1-1-1Z"
          fill="#ff6800"
        />
        <path
          d="M15,9c-.55,0-1,.45-1,1v2c0,.55.45,1,1,1s1-.45,1-1v-2c0-.55-.45-1-1-1Z"
          fill="#ff6800"
        />
        <path
          d="M12,10c-.55,0-1,.45-1,1v1c0,.55.45,1,1,1s1-.45,1-1v-1c0-.55-.45-1-1-1Z"
          fill="#ff6800"
        />
      </g>
    </svg>
  );
}

export default Dashboard;
