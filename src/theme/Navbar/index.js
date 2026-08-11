import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import OriginalNavbar from '@theme-original/Navbar';

export default function Navbar(props) {
  const [version, setVersion] = useState(null);

  const [containerEl, setContainerEl] = useState(null);

  useEffect(() => {
    let mounted = true;
    // fetch latest release tag 
    fetch('https://api.github.com/repos/kmesh-net/kmesh/releases/latest')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data && data.tag_name) setVersion(data.tag_name);
      })
      .catch(() => {
        // network or API error 
      });

    if (typeof document !== 'undefined') {
      const searchEl = document.querySelector('.navbar__search, .DocSearch-Button');
      const navRight = document.querySelector('.navbar__items--right');
      if (searchEl) {
        const searchItem = searchEl.closest('.navbar__item') || searchEl.parentNode;
        const container = navRight || (searchItem && searchItem.parentNode);
        if (container && searchItem) {
        
          let existing = container.querySelector('.kmesh-version-container');
          if (!existing) {
            const wrapper = document.createElement('div');
            wrapper.className = 'kmesh-version-container';
            wrapper.style.display = 'inline-flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.margin = '0 0.5rem 0 0';
            wrapper.style.padding = '0';
            container.insertBefore(wrapper, searchItem);
            setContainerEl(wrapper);
          } else {
            setContainerEl(existing);
          }
        } else if (navRight) {
        
          let existing = navRight.querySelector('.kmesh-version-container');
          if (!existing) {
            const wrapper = document.createElement('div');
            wrapper.className = 'kmesh-version-container';
            wrapper.style.display = 'inline-flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.margin = '0 0.5rem 0 0';
            wrapper.style.padding = '0';
            navRight.appendChild(wrapper);
            setContainerEl(wrapper);
          } else {
            setContainerEl(existing);
          }
        }
      } else if (navRight) {

        let existing = navRight.querySelector('.kmesh-version-container');
        if (!existing) {
          const wrapper = document.createElement('div');
          wrapper.className = 'kmesh-version-container';
          wrapper.style.display = 'inline-flex';
          wrapper.style.alignItems = 'center';
          wrapper.style.margin = '0 0.5rem 0 0';
          wrapper.style.padding = '0';
          navRight.appendChild(wrapper);
          setContainerEl(wrapper);
        } else {
          setContainerEl(existing);
        }
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <OriginalNavbar {...props} />
      {version && containerEl &&
        ReactDOM.createPortal(
          <div className="kmesh-version-badge" title={`Kmesh release ${version}`}>
            {version}
          </div>,
          containerEl
        )}
    </>
  );
}
