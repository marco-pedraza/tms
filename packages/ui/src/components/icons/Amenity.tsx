export interface AmenityProps {
  className?: string;
}

function Amenity({ className }: AmenityProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={className}>
      <g id="c">
        <path d="M0,0h24v24H0V0Z" fill="none" />
        <path
          d="M12.42,22.63h-6c-2.76,0-5-2.24-5-5v-8c0-1.1.9-2,2-2h14c2.76,0,5,2.24,5,5s-2.24,5-5,5c0,2.76-2.24,5-5,5ZM3.42,9.63v8c0,1.65,1.35,3,3,3h6c1.65,0,3-1.35,3-3v-8H3.42ZM17.42,15.63c1.65,0,3-1.35,3-3s-1.35-3-3-3v6Z"
          fill="#00491f"
        />
        <path
          d="M9.42,1.63c-.55,0-1,.45-1,1v2c0,.55.45,1,1,1s1-.45,1-1v-2c0-.55-.45-1-1-1Z"
          fill="#ff6800"
        />
        <path
          d="M13.42,1.63c-.55,0-1,.45-1,1v2c0,.55.45,1,1,1s1-.45,1-1v-2c0-.55-.45-1-1-1Z"
          fill="#ff6800"
        />
        <path
          d="M5.42,1.63c-.55,0-1,.45-1,1v2c0,.55.45,1,1,1s1-.45,1-1v-2c0-.55-.45-1-1-1Z"
          fill="#ff6800"
        />
      </g>
    </svg>
  );
}

export default Amenity;
