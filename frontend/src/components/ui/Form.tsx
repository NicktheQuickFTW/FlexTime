import React, { forwardRef, useState } from 'react';
import { Save, X, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { FTButton } from './Button';
import { FTCard } from './Card';

// Form Context for managing form state
interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: string) => void;
  setTouched: (name: string, touched: boolean) => void;
  validateField: (name: string, value: any) => string | undefined;
}

const FormContext = React.createContext<FormContextType | null>(null);

export const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FTForm');
  }
  return context;
};

// Form validation utilities
type ValidationRule = {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
};

type ValidationSchema = Record<string, ValidationRule>;

const validateValue = (value: any, rules: ValidationRule): string | undefined => {
  if (rules.required && (!value || value.toString().trim() === '')) {
    return 'This field is required';
  }

  if (value && rules.min && value.length < rules.min) {
    return `Must be at least ${rules.min} characters`;
  }

  if (value && rules.max && value.length > rules.max) {
    return `Must be no more than ${rules.max} characters`;
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    return 'Invalid format';
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return undefined;
};

// Form Props
interface FTFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  initialValues?: Record<string, any>;
  validationSchema?: ValidationSchema;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onReset?: () => void;
  variant?: 'default' | 'glass' | 'minimal';
  showButtons?: boolean;
  submitText?: string;
  resetText?: string;
  cancelText?: string;
  onCancel?: () => void;
  autoValidate?: boolean;
  children: React.ReactNode;
}

// Form Group Props
interface FTFormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Form Section Props
interface FTFormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  columns?: 1 | 2 | 3 | 4;
}

// Form Actions Props
interface FTFormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
  sticky?: boolean;
}

// Main Form Component
export const FTForm = forwardRef<HTMLFormElement, FTFormProps>(({
  initialValues = {},
  validationSchema = {},
  onSubmit,
  onReset,
  variant = 'glass',
  showButtons = true,
  submitText = 'Save',
  resetText = 'Reset',
  cancelText = 'Cancel',
  onCancel,
  autoValidate = true,
  children,
  className = '',
  ...props
}, ref) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  const setValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (autoValidate && touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    }
  };

  const setError = (name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const setTouchedField = (name: string, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  };

  const validateField = (name: string, value: any): string | undefined => {
    const rules = validationSchema[name];
    if (!rules) return undefined;
    return validateValue(value, rules);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await onSubmit(values);
      setSubmitStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      setSubmitStatus('error');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitStatus('idle');
    onReset?.();
  };

  const getFormStyles = () => {
    const variants = {
      default: 'bg-white border border-gray-200 shadow-lg',
      glass: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-xl',
      minimal: 'bg-transparent border-0'
    };
    return variants[variant];
  };

  const contextValue: FormContextType = {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    setValue,
    setError,
    setTouched: setTouchedField,
    validateField
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={`
          ${getFormStyles()}
          rounded-xl p-6 space-y-6
          ${className}
        `}
        {...props}
      >
        {children}
        
        {showButtons && (
          <FTFormActions>
            {onCancel && (
              <FTButton
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
                leftIcon={<X size={16} />}
              >
                {cancelText}
              </FTButton>
            )}
            
            <div className="flex items-center gap-3">
              {isDirty && (
                <FTButton
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  leftIcon={<RotateCcw size={16} />}
                >
                  {resetText}
                </FTButton>
              )}
              
              <FTButton
                type="submit"
                variant="primary"
                loading={isSubmitting}
                loadingText="Saving..."
                leftIcon={
                  submitStatus === 'success' ? (
                    <CheckCircle size={16} />
                  ) : submitStatus === 'error' ? (
                    <AlertCircle size={16} />
                  ) : (
                    <Save size={16} />
                  )
                }
                glowEffect
              >
                {submitText}
              </FTButton>
            </div>
          </FTFormActions>
        )}
        
        {/* Status indicator */}
        {submitStatus !== 'idle' && (
          <div className={`
            text-sm font-medium flex items-center gap-2
            ${submitStatus === 'success' ? 'text-green-600' : 'text-red-600'}
          `}>
            {submitStatus === 'success' ? (
              <>
                <CheckCircle size={16} />
                Changes saved successfully
              </>
            ) : (
              <>
                <AlertCircle size={16} />
                Please check the form for errors
              </>
            )}
          </div>
        )}
      </form>
    </FormContext.Provider>
  );
});

FTForm.displayName = 'FTForm';

// Form Group Component
export const FTFormGroup = forwardRef<HTMLDivElement, FTFormGroupProps>(({
  title,
  subtitle,
  collapsible = false,
  defaultCollapsed = false,
  children,
  className = '',
  ...props
}, ref) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div
      ref={ref}
      className={`space-y-4 ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div 
          className={`
            ${collapsible ? 'cursor-pointer select-none' : ''}
            flex items-center justify-between
          `}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        >
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {collapsible && (
            <button
              type="button"
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg
                className={`
                  w-5 h-5 transition-transform duration-200
                  ${isCollapsed ? 'rotate-180' : ''}
                `}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      {(!collapsible || !isCollapsed) && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
});

FTFormGroup.displayName = 'FTFormGroup';

// Form Section Component
export const FTFormSection = forwardRef<HTMLDivElement, FTFormSectionProps>(({
  title,
  subtitle,
  columns = 1,
  children,
  className = '',
  ...props
}, ref) => {
  const getGridCols = () => {
    const cols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    };
    return cols[columns];
  };

  return (
    <div
      ref={ref}
      className={`space-y-4 ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div>
          {title && (
            <h4 className="text-base font-medium text-gray-900 dark:text-white">
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className={`grid gap-4 ${getGridCols()}`}>
        {children}
      </div>
    </div>
  );
});

FTFormSection.displayName = 'FTFormSection';

// Form Actions Component
export const FTFormActions = forwardRef<HTMLDivElement, FTFormActionsProps>(({
  align = 'right',
  sticky = false,
  children,
  className = '',
  ...props
}, ref) => {
  const getAlignment = () => {
    const alignments = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between'
    };
    return alignments[align];
  };

  return (
    <div
      ref={ref}
      className={`
        flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700
        ${getAlignment()}
        ${sticky ? 'sticky bottom-0 bg-white dark:bg-gray-900 p-4 -mx-6 -mb-6' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

FTFormActions.displayName = 'FTFormActions';

export default FTForm;