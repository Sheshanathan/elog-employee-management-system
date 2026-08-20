import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../styles/design-system.css';

/**
 * ConfirmationModal - Professional modal for confirming important actions
 * Usage example:
 * <ConfirmationModal 
 *   isOpen={true} 
 *   title="Delete Employee"
 *   message="Are you sure you want to delete John Doe?"
 *   warning="This action cannot be undone."
 *   confirmText="Delete Employee"
 *   onConfirm={handleDelete}
 *   onCancel={handleCancel}
 *   isLoading={false}
 *   isDangerous={true}
 * />
 */
export function ConfirmationModal({
  isOpen,
  title,
  message,
  warning,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  isDangerous = false
}) {
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    if (onCancel) {
      onCancel();
    }
  };

  if (!showModal) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          {warning && <p className="modal-warning-details">{warning}</p>}
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'} ${isLoading ? 'is-loading' : ''}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * PasswordField - Password input with visibility toggle
 */
export function PasswordField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  helperText,
  disabled = false,
  wrapperClassName = "form-group",
  inputErrorClassName = "is-invalid",
  errorClassName = "form-error",
  autoComplete = "new-password",
  id
}) {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = !!error;
  const inputId = id || name;
  const useFormLabel = wrapperClassName === "form-group";

  return (
    <div className={wrapperClassName}>
      {label && (
        useFormLabel ? (
          <label htmlFor={inputId} className={`form-label ${required ? "required" : ""}`}>
            {label}
          </label>
        ) : (
          <label htmlFor={inputId}>
            {label}
            {required && <span className="required-mark"> *</span>}
          </label>
        )
      )}
      <div className="input-with-toggle">
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          name={name}
          value={value || ""}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={hasError ? inputErrorClassName : ""}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="input-toggle-btn"
          onClick={() => setShowPassword((previous) => !previous)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {helperText && <div className="form-helper">{helperText}</div>}
      {error && (
        errorClassName === "field-error" ? (
          <span className={errorClassName}>{error}</span>
        ) : (
          <div className={errorClassName}>{error}</div>
        )
      )}
    </div>
  );
}


/**
 * FormField - Reusable form field component with label, validation, and error display
 * Supports text, email, password, date, number, select, and textarea inputs
 */
export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  placeholder,
  helperText,
  disabled = false,
  options = [],
  min,
  max,
  step,
  onBlur,
  emptyLabel
}) {
  const hasError = !!error;

  if (type === 'select') {
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={name} className={`form-label ${required ? 'required' : ''}`}>
            {label}
          </label>
        )}
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={hasError ? 'is-invalid' : ''}
        >
          <option value="">{emptyLabel ? `-- ${emptyLabel} --` : `-- Select ${label?.toLowerCase()} --`}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helperText && <div className="form-helper">{helperText}</div>}
        {error && <div className="form-error">{error}</div>}
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={name} className={`form-label ${required ? 'required' : ''}`}>
            {label}
          </label>
        )}
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={hasError ? 'is-invalid' : ''}
        />
        {helperText && <div className="form-helper">{helperText}</div>}
        {error && <div className="form-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={hasError ? 'is-invalid' : ''}
      />
      {helperText && <div className="form-helper">{helperText}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

/**
 * LoadingSpinner - Loading indicator
 */
export function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

/**
 * ResultsSummary - Showing X of Y count above list tables
 */
export function ResultsSummary({ shown, total, label = "results" }) {
  return (
    <div className="results-summary">
      <p>
        Showing {shown} of {total} {label}
      </p>
    </div>
  );
}

/**
 * EmptyState - Display when no data is available
 */
export function EmptyState({ 
  title = "No Data Available", 
  message = "There is no data to display.",
  action = null,
  actionText = "Create New"
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
      {action && (
        <button className="btn btn-primary mt-6" onClick={action}>
          {actionText}
        </button>
      )}
    </div>
  );
}

/**
 * ErrorState - Display when an error occurs
 */
export function ErrorState({ 
  title = "Error Loading Data", 
  message = "An error occurred while loading data.",
  action = null,
  actionText = "Try Again"
}) {
  return (
    <div className="error-state">
      <div className="error-state-icon" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
      {action && (
        <button className="btn btn-primary mt-6" onClick={action}>
          {actionText}
        </button>
      )}
    </div>
  );
}

/**
 * StatusBadge - Display status with appropriate styling
 */
export function StatusBadge({ status }) {
  let badgeClass = 'badge-primary';

  if (status === 'Active' || status === 'Approved' || status === 'Present') {
    badgeClass = 'badge-success';
  } else if (status === 'Inactive' || status === 'Rejected' || status === 'Absent') {
    badgeClass = 'badge-error';
  } else if (status === 'Pending') {
    badgeClass = 'badge-warning';
  } else if (status === 'Leave' || status === 'On Leave') {
    badgeClass = 'badge-info';
  } else if (status === 'Cancelled') {
    badgeClass = 'badge-primary';
  }

  return <span className={`badge table-badge ${badgeClass}`}>{status}</span>;
}

/**
 * RoleBadge - Display user role in tables
 */
export function RoleBadge({ role }) {
  const badgeClass = role === 'Admin' ? 'badge-info' : 'badge-primary';

  return <span className={`badge table-badge ${badgeClass}`}>{role}</span>;
}

/**
 * Card - Reusable card component
 */
export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * RowActionsMenu - Compact dropdown for table row actions
 */
export function RowActionsMenu({ items, label = 'Actions', ariaLabel = 'Row actions' }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, minWidth: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 148;
      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8
      );

      setMenuStyle({
        top: rect.bottom + 4,
        left,
        minWidth: menuWidth,
      });
    };

    updatePosition();

    const handlePointerDown = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleSelect = (item) => {
    if (item.disabled) return;
    item.onClick?.();
    setOpen(false);
  };

  return (
    <div className="row-actions-menu-wrap">
      <button
        ref={triggerRef}
        type="button"
        className="row-actions-trigger"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <span>{label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="row-actions-menu"
          role="menu"
          style={menuStyle}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={`row-actions-item${item.danger ? ' is-danger' : ''}${item.disabled ? ' is-disabled' : ''}`}
              disabled={item.disabled}
              onClick={() => handleSelect(item)}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * DataTable - Professional table component with features
 */
export function DataTable({ 
  columns, 
  data, 
  isLoading = false, 
  isEmpty = false,
  onRowClick,
  actions = null 
}) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isEmpty || !data || data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr 
              key={row._id || idx} 
              onClick={() => onRowClick && onRowClick(row)}
              style={onRowClick ? { cursor: 'pointer' } : {}}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td>
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
