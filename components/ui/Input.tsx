
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, id, className, icon, ...props }) => {
    const hasIcon = !!icon;
    return (
        <div className={className}>
            {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary-dark mb-1">{label}</label>}
            <div className="relative">
                {hasIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {icon}
                    </div>
                )}
                <input 
                    id={id}
                    className={`w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-text-primary-dark placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent ${hasIcon ? 'pl-10' : ''}`} 
                    {...props} 
                />
            </div>
        </div>
    );
};

export default Input;
