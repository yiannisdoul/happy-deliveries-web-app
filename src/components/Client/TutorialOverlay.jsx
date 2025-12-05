import React, { useEffect, useState, useRef } from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { TUTORIAL_STEPS, TUTORIAL_MAX_STEPS } from '../../data/tutorialSteps';

// Utility function to get element position
const getTargetRect = (targetId) => {
    if (!targetId) return null;
    const element = document.getElementById(targetId);
    if (!element) return null;
    return element.getBoundingClientRect();
};

export default function TutorialOverlay({ currentStep, setCurrentStep, isTutorialActive, setIsTutorialActive }) {
    const popoverRef = useRef(null);
    const [overlayStyle, setOverlayStyle] = useState({});
    const [arrowStyle, setArrowStyle] = useState({});
    const [finalRect, setFinalRect] = useState(null); 

    const stepData = TUTORIAL_STEPS[currentStep - 1];

    const handleNext = () => {
        if (currentStep < TUTORIAL_MAX_STEPS) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSkip();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        setIsTutorialActive(false);
        localStorage.setItem('tutorial_completed', 'true'); 
        setCurrentStep(1); 
    };

    useEffect(() => {
        if (!isTutorialActive || !stepData) return;

        const updatePosition = () => {
            const rect = getTargetRect(stepData.target);

            // --- A. CENTERED MODAL ---
            if (!rect) {
                setOverlayStyle({ 
                    position: 'fixed', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-55%, -50%)', 
                    width: '350px',
                    zIndex: 10001 
                });
                setArrowStyle({});
                setFinalRect(null); 
                return;
            }
            
            // --- B. SCROLL FIX ---
            const isElementVisible = (rect.top >= 0 && rect.bottom <= window.innerHeight);
            if (!isElementVisible) {
                window.scrollTo({ 
                    top: rect.top + window.scrollY - 100, 
                    behavior: 'auto' 
                });
            }
            
            const finalTargetRect = getTargetRect(stepData.target);
            if (!finalTargetRect) return;

            setFinalRect({
                top: finalTargetRect.top,
                left: finalTargetRect.left,
                width: finalTargetRect.width,
                height: finalTargetRect.height,
            });

            // --- C. POPOVER POSITIONING CALCULATION ---
            const popoverWidth = 350; 
            // Get height safely, default to 200 if not rendered yet
            const popoverHeight = popoverRef.current ? popoverRef.current.offsetHeight : 200; 
            
            let top, left, arrowPosition;
            const padding = 20;
            
            switch (stepData.position) {
                case 'bottom-right':
                    top = finalTargetRect.bottom + padding;
                    left = finalTargetRect.right - popoverWidth;
                    arrowPosition = { top: '-10px', right: '10px', transform: 'rotate(45deg)' };
                    break;
                case 'right':
                    top = finalTargetRect.top + (finalTargetRect.height / 2) - (popoverHeight / 2);
                    left = finalTargetRect.right + padding;
                    arrowPosition = { top: '50%', left: '-10px', transform: 'translateY(-50%) rotate(-45deg)' };
                    break;
                case 'top-right':
                    top = finalTargetRect.top - popoverHeight - padding;
                    left = finalTargetRect.right - popoverWidth;
                    arrowPosition = { bottom: '-10px', right: '10px', transform: 'rotate(-45deg)' };
                    break;
                case 'left':
                    top = finalTargetRect.top + (finalTargetRect.height / 2) - (popoverHeight / 2);
                    left = finalTargetRect.left - popoverWidth - padding;
                    arrowPosition = { top: '50%', right: '-10px', transform: 'translateY(-50%) rotate(135deg)' };
                    break;
                case 'bottom':
                default:
                    top = finalTargetRect.bottom + padding;
                    left = finalTargetRect.left + (finalTargetRect.width / 2) - (popoverWidth / 2);
                    arrowPosition = { top: '-10px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
                    break;
            }

            // --- D. VIEWPORT BOUNDARY CLAMP (THE FIX) ---
            // This ensures the popover never goes off-screen, regardless of the target element's size.
            
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // 1. Clamp Bottom: If popover goes below screen, push it up
            if (top + popoverHeight > viewportHeight - padding) {
                top = viewportHeight - popoverHeight - padding;
                
                // Optional: If we clamped it heavily, the arrow might look wrong. 
                // We can hide it or adjust it. For now, we'll just let it stay 
                // because having the text visible is more important.
            }

            // 2. Clamp Top: Don't let it go off the top
            if (top < padding) {
                top = padding;
            }

            // 3. Clamp Right side
            if (left + popoverWidth > viewportWidth - padding) {
                left = viewportWidth - popoverWidth - padding;
            }

            // 4. Clamp Left side
            if (left < padding) {
                left = padding;
            }

            setOverlayStyle({ 
                position: 'fixed', 
                top: `${top}px`,   
                left: `${left}px`,
                width: `${popoverWidth}px`,
                zIndex: 10001
            });
            setArrowStyle(arrowPosition);
        };

        const timeoutId = setTimeout(updatePosition, 50); 
        
        window.addEventListener('scroll', updatePosition, { passive: true });
        window.addEventListener('resize', updatePosition);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };

    }, [currentStep, stepData, isTutorialActive]); 

    if (!isTutorialActive || !stepData) return null;

    return (
        <>
            {stepData.target && <div className="fixed inset-0 bg-black opacity-50 z-[9999]"></div>}

            <div 
                ref={popoverRef}
                className="bg-white rounded-lg shadow-2xl p-5 border-4 border-blue-500 transition-all duration-75"
                style={overlayStyle}
            >
                <button 
                    onClick={handleSkip} 
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 z-10"
                    title="Skip Tutorial"
                >
                    <X className="w-5 h-5" />
                </button>

                {stepData.target && (
                    <div 
                        className="absolute h-5 w-5 bg-blue-500 border-4 border-white shadow-lg z-[-1]"
                        style={{ ...arrowStyle }} 
                    ></div>
                )}

                <h4 className="text-lg font-bold text-blue-800 mb-2">{stepData.title}</h4>
                <p className="text-sm text-gray-700 mb-4">{stepData.content}</p>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                        Step {currentStep} of {TUTORIAL_MAX_STEPS}
                    </p>
                    <div className="flex space-x-2">
                        {currentStep > 1 && (
                            <button 
                                onClick={handlePrevious} 
                                className="px-3 py-1 text-sm text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1"/> Prev
                            </button>
                        )}
                        <button 
                            onClick={handleNext} 
                            className={`px-3 py-1 text-sm rounded-lg font-semibold transition-colors flex items-center ${currentStep === TUTORIAL_MAX_STEPS ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                        >
                            {currentStep === TUTORIAL_MAX_STEPS ? 'Finish' : 'Next'} <ArrowRight className="w-4 h-4 ml-1"/>
                        </button>
                    </div>
                </div>
            </div>
            
            {finalRect && ( 
                <div 
                    id={`highlight-${stepData.target}`} 
                    className="fixed border-4 border-blue-500 rounded-lg pointer-events-none transition-all duration-75"
                    style={{ 
                        top: finalRect.top, 
                        left: finalRect.left, 
                        width: finalRect.width, 
                        height: finalRect.height,
                        zIndex: 10000 
                    }}
                ></div>
            )}
        </>
    );
}