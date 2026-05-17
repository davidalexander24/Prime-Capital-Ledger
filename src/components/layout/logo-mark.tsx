type LogoMarkProps = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 40, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="320 320 860 860"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <clipPath id="ae12824f5b">
          <path d="M 380.613281 626 L 874 626 L 874 1119.363281 L 380.613281 1119.363281 Z M 380.613281 626 " clipRule="nonzero"/>
        </clipPath>
        <clipPath id="4485261722">
          <path d="M 626 380.613281 L 1119.363281 380.613281 L 1119.363281 874 L 626 874 Z M 626 380.613281 " clipRule="nonzero"/>
        </clipPath>
      </defs>
      <path fill="#001842" d="M 626.804688 626.804688 L 872.996094 626.804688 L 872.996094 872.996094 L 626.804688 872.996094 Z M 626.804688 626.804688 " fillOpacity="1" fillRule="evenodd"/>
      <g clipPath="url(#ae12824f5b)">
        <path fill="#00daf2" d="M 380.613281 873.171875 L 380.613281 626.804688 L 626.804688 626.804688 L 626.804688 873.171875 L 873.171875 873.171875 L 873.171875 1119.363281 L 626.804688 1119.363281 L 626.804688 873.171875 Z M 380.613281 873.171875 " fillOpacity="1" fillRule="evenodd"/>
      </g>
      <g clipPath="url(#4485261722)">
        <path fill="#0a6cff" d="M 626.804688 626.804688 L 626.804688 380.613281 L 1119.363281 380.613281 L 1119.363281 873.171875 L 873.171875 873.171875 L 873.171875 626.804688 Z M 626.804688 626.804688 " fillOpacity="1" fillRule="evenodd"/>
      </g>
    </svg>
  );
}
