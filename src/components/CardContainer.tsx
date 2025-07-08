// components/CardContainer.tsx
import React, { forwardRef } from 'react';

interface CardContainerProps {
    children: React.ReactNode;
    className?: string;
}

const CardContainer = forwardRef<HTMLDivElement, CardContainerProps>(({ children, className = '' }, ref) => {
    return (
        <div ref={ref} className={`bg-base-200 rounded-xl p-6 shadow-lg ${className}`}>
            {children}
        </div>
    );
});

CardContainer.displayName = 'CardContainer';

export default CardContainer;