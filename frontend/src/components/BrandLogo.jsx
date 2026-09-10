import acmeLogo from '../assets/acme-logo.svg'

function BrandLogo({ compact = false }) {
  return (
    <a
      href="/"
      className={`inline-flex items-center gap-4 text-slate-950 ${
        compact ? '' : 'mb-18'
      }`}
      aria-label="Acme employee directory home"
    >
      <img
        src={acmeLogo}
        alt=""
        className={`${compact ? 'h-9 w-9' : 'h-11 w-11'} rounded-xl shadow-lg shadow-blue-200`}
      />
      <span
        className={`${compact ? 'text-3xl' : 'text-4xl'} font-bold tracking-normal`}
      >
        Acme
      </span>
    </a>
  )
}

export default BrandLogo
