import { useState, useEffect } from 'react';

function PageSelector({ mobilePage, desktopPage }) {
  const mobile = window.matchMedia('(max-width: 767px)');
  const [isMobile, setIsMobile] = useState(mobile.matches);

  useEffect(() => {
    const handleChange = (event) => {
      setIsMobile(event.matches);
    };
    mobile.addEventListener('change', handleChange);

    return () => {
      mobile.removeEventListener('change', handleChange);
    };
  }, []);

  return isMobile ? mobilePage : desktopPage;
}

export default PageSelector;
