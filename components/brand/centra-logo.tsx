import Image from 'next/image';

type CentraLogoProps = {
  compact?: boolean;
  inverted?: boolean;
  priority?: boolean;
};

export function CentraLogo({
  compact = false,
  inverted = false,
  priority = false,
}: CentraLogoProps) {
  return (
    <span
      className={`centra-logo${compact ? ' is-compact' : ''}${inverted ? ' is-inverted' : ''}`}
      aria-label="CENTRA"
    >
      <Image
        className="centra-logo-mark"
        src={inverted ? '/centra-mark-inverted.svg' : '/centra-mark.svg'}
        alt=""
        width={42}
        height={42}
        priority={priority}
      />
      {!compact && (
        <span className="centra-logo-copy">
          <strong>CENTRA</strong>
          <small>Todo tu negocio en un solo lugar</small>
        </span>
      )}
    </span>
  );
}
