function AppLogo({ className = "app-logo", alt = "elog" }) {
    return (
        <img
            src="/elog-logo.png"
            alt={alt}
            className={className}
        />
    );
}

export default AppLogo;
