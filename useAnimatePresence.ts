import { useCallback, useEffect, useRef, useState } from 'react';

/*
Example usage:
import {useState} from 'react';

import {useAnimatePresence} from 'react-animate-presence';

function MyComponent() {
  const [isVisible, setIsVisible] = useState(true);

  const {ref, animationClassName, isRendered} = useAnimatePresence({
    visible: isVisible,
    animation: {
      enter: 'fade-in',
      exit: 'fade-out',
    },
    onExitComplete: () => console.log('Exit animation completed'),
  });

  return (
    <>
      <button onClick={() => setIsVisible(!isVisible)}>Toggle</button>
      {isRendered && (
        <div ref={ref} className={animationClassName}>
          Fade in/out content
        </div>
      )}
    </>
  );
}
*/

interface AnimationConfig {
  enter: string;
  exit: string;
}

interface UseAnimatePresenceProps {
  animation: AnimationConfig;
  visible?: boolean;
  onExitComplete?: () => void;
}

interface UseAnimatePresenceReturn<T = HTMLDivElement> {
  ref: React.RefObject<T>;
  animationClassName: string;
  isRendered: boolean;
  isExiting: boolean;
}

const useAnimatePresence = <T extends HTMLElement = HTMLDivElement>({
  visible = false,
  animation,
  onExitComplete
}: UseAnimatePresenceProps): UseAnimatePresenceReturn<T> => {
  const [state, setState] = useState({
    isRendered: visible,
    animationClassName: visible ? animation.enter : '',
    isExiting: false
  });

  const ref = useRef<T>(null);
  const prevVisibleRef = useRef(visible);

  useEffect(() => {
    if (visible !== prevVisibleRef.current) {
      setState((prevState) => ({
        ...prevState,
        ...(!visible && { isExiting: true }),
        isRendered: visible || state.isRendered,
        animationClassName: visible ? animation.enter : animation.exit
      }));
      prevVisibleRef.current = visible;
    }
  }, [visible, animation, state.isRendered]);

  const handleAnimationEnd = useCallback(() => {
    if (!visible) {
      onExitComplete?.();
      setState((prevState) => ({
        ...prevState,
        isRendered: false,
        isExiting: false
      }));
    }
  }, [visible, onExitComplete]);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.addEventListener('animationend', handleAnimationEnd);
      return () => {
        element.removeEventListener('animationend', handleAnimationEnd);
      };
    }
  }, [handleAnimationEnd]);

  return {
    ref,
    animationClassName: state.animationClassName,
    isRendered: state.isRendered,
    isExiting: state.isExiting
  };
};

export default useAnimatePresence;