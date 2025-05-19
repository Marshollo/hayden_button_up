chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.startsWith('https://beta.console.hayden.ai/matches')) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: initializeButtons,
    });
  }
});

function initializeButtons() {
  addCustomButtons();

  const observer = new MutationObserver(handleMutations);
  observer.observe(document.body, { childList: true, subtree: true });

  function handleMutations(mutations) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.classList?.contains('container-fluid') && node.className === 'container-fluid') {
          console.log('MutationObserver: Exact container-fluid found.');
          addCustomButtons();
          return;
        }
      }
    }
  }

  function addCustomButtons() {
    const container = findExactContainerFluid();
    if (!container) return;

    const style = document.createElement('style');
    style.textContent = `
    [class="sc-bBeLUv"] {
      height: 0.2em;
    }
  `;
    document.head.appendChild(style);

    const firstChild = container.children[0];
    if (!firstChild) {
      console.error('First child in container-fluid not found.');
      return;
    }

    if (container.querySelector('.custom-button-wrapper')) {
      console.log('Buttons already exist.');
      return;
    }

    console.log('Adding new buttons...');

    const buttonWrapper = createButtonWrapper();
    container.insertBefore(buttonWrapper, firstChild.nextSibling);
    console.log('Buttons have been added!');
  }

  function findExactContainerFluid() {
    const containers = document.querySelectorAll('.container-fluid');
    return Array.from(containers).find((el) => el.className === 'container-fluid');
  }

  function createButtonWrapper() {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-button-wrapper';
    Object.assign(wrapper.style, {
      marginTop: '5px',
      marginBottom: '0.2em',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '5px',
      whiteSpace: 'nowrap',
      flexShrink: '0',
    });

    const buttonsU = createButtonGroup('Reject:', [
      { text: 'Plate illegible', option: 'Plate illegible', key: 'KeyU' },
      { text: 'Moving vehicle', option: 'Moving vehicle', key: 'KeyU' },
      { text: 'Location changed', option: 'Location changed', key: 'KeyU' },
    ], 'rgb(235, 76, 85)'); // Kolor dla buttonsU

    const buttonsI = createButtonGroup('Reject All:', [
      { text: 'Outside enforce zone', option: 'Outside enforce zone', key: 'KeyI' },
      { text: 'Other', option: 'Other', key: 'KeyI' },
    ], 'rgb(100, 0, 0)'); // Inny kolor dla buttonsI

    wrapper.append(buttonsU.label, buttonsU.group, buttonsI.label, buttonsI.group);
    return wrapper;
  }

  function createButtonGroup(labelText, buttons, color) {
    const label = document.createElement('span');
    label.textContent = labelText;
    label.style.fontWeight = 'bold';
    label.style.marginRight = '5px';
    label.style.color = '#333';

    const groupWrapper = document.createElement('div');
    groupWrapper.style.display = 'flex';
    groupWrapper.style.gap = '5px';

    buttons.forEach(({ text, option, key }) => {
      const button = document.createElement('button');
      button.textContent = text;
      Object.assign(button.style, {
        background: color,
        border: 'none',
        color: 'white',
        borderRadius: '8px',
        padding: '4px 15px',
        flexShrink: '0',
        fontSize: '15px',
        cursor: 'pointer',
      });
      button.addEventListener('click', () => handleOptionSelection(option, key));
      groupWrapper.appendChild(button);
    });

    return { label, group: groupWrapper };
  }

  function handleOptionSelection(optionText, key) {
    const buttonInDropdown = document.querySelector(`button[data-accesskey="${key}"]`);
    if (!buttonInDropdown) {
      console.error(`Button opening dropdown for ${key} not found.`);
      return;
    }

    buttonInDropdown.click();
    console.log(`Dropdown opened for ${key}.`);

    waitForDropdown().then((dropdown) => {
      if (!dropdown) return;

      const option = Array.from(
        dropdown.querySelectorAll('a.item.dropdown-item[role="button"]')
      ).find((item) => item.textContent.trim() === optionText);

      if (option) {
        option.click();
        console.log(`Option "${optionText}" selected in ${key}.`);
      } else {
        console.error(`Option "${optionText}" not found in ${key}.`);
      }
    });
  }

  function waitForDropdown() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const dropdown = document.querySelector('#rejectDropdown');
        if (dropdown?.classList.contains('show')) {
          clearInterval(interval);
          resolve(dropdown);
        }
      }, 50);
    });
  }
}
