// Import CSS
import './style.css'

// Constants for operators and special actions
const OPERATORS = {
  '×': '*',
  '÷': '/',
  '+': '+',
  '-': '-'
};

const ACTIONS = {
  AC: 'AC',
  BACKSPACE: '⌫',    // Rename from CLEAR to BACKSPACE for clarity
  EQUALS: '=',
  TOGGLE_SIGN: '+/-',
  PERCENT: '%'
};

// Select DOM elements
const display = document.querySelector('#display div');
const buttons = document.querySelectorAll('.btn');

// Variable to store calculator state
let currentExpression = '0';

// Optimized function to format numbers
const formatNumber = (number) => {
  // Convert to number for processing
  const num = typeof number === 'string' ? parseFloat(number) : number;
  
  // If it's an integer, no need for decimals
  if (Number.isInteger(num)) {
    // If the number is too large, use scientific notation
    if (Math.abs(num) >= 1e10) {
      return num.toExponential(4);
    }
    return num.toString();
  }
  
  // For decimal numbers
  const numStr = num.toString();
  
  // If already in scientific notation
  if (numStr.includes('e')) {
    const [mantissa, exponent] = numStr.split('e');
    const formattedMantissa = parseFloat(mantissa).toFixed(4);
    return `${formattedMantissa}e${exponent}`;
  }
  
  // For normal decimal numbers
  const [integer, decimal] = numStr.split('.');
  
  // If the integer part is already long
  if (integer.length > 10) {
    return num.toExponential(4);
  }
  
  // Limit decimals based on integer part length
  const maxDecimalLength = Math.max(0, 10 - integer.length);
  return parseFloat(num.toFixed(maxDecimalLength)).toString();
};

// Function to adjust text size based on its length
const adjustFontSize = () => {
  const displayText = display.textContent;
  const length = displayText.length;
  
  // Remove all size classes
  display.classList.remove('text-6xl', 'text-5xl', 'text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base');
  
  // Apply appropriate class
  if (length <= 8) {
    display.classList.add('text-6xl');
  } else if (length <= 10) {
    display.classList.add('text-5xl');
  } else if (length <= 12) {
    display.classList.add('text-4xl');
  } else if (length <= 16) {
    display.classList.add('text-3xl');
  } else if (length <= 20) {
    display.classList.add('text-2xl');
  } else if (length <= 25) {
    display.classList.add('text-xl');
  } else if (length <= 30) {
    display.classList.add('text-lg');
  } else {
    display.classList.add('text-base');
  }
};

// Function to update the display
const updateDisplay = () => {
  let displayValue = currentExpression;
  
  // If it's a number (not an expression being entered with operators)
  if (!isNaN(parseFloat(displayValue)) && isFinite(displayValue)) {
    // Format the number if needed
    displayValue = formatNumber(displayValue);
  }
  
  // Update the display
  display.textContent = displayValue;
  
  // Adjust font size based on length
  adjustFontSize();
};

// Helper functions for expression management
function extractLastNumber(expression) {
  // Extract the last number from the expression
  const match = expression.match(/(-?\d+\.?\d*)$/);
  return match ? parseFloat(match[0]) : null;
}

function replaceLastNumber(expression, newValue) {
  // Replace the last number with the new value
  return expression.replace(/(-?\d+\.?\d*)$/, formatNumber(newValue));
}

// Function to toggle the sign of a number
const toggleNumberSign = (expression) => {
  // If the expression is just "0", do nothing
  if (expression === '0') return expression;
  
  // Find the last number in the expression
  const lastNumberRegex = /(-?\d+\.?\d*)$/;
  const match = expression.match(lastNumberRegex);
  
  if (match) {
    const lastNumber = match[0];
    const negatedNumber = lastNumber.startsWith('-') 
      ? lastNumber.substring(1) 
      : `-${lastNumber}`;
      
    // Replace the last number with its sign-inverted version
    return expression.replace(lastNumberRegex, negatedNumber);
  }
  
  return expression;
};

// Prepare expression for the API
const prepareExpressionForAPI = (expression) => {
  return expression
    .replace(/×/g, '*')  // Replace × with *
    .replace(/÷/g, '/'); // Replace ÷ with /
};

// Function to handle calculation errors
const handleCalculationError = (errorMessage) => {
  console.error("Calculation error:", errorMessage);
  currentExpression = 'Error';
  updateDisplay();
  
  // Use Tailwind classes for shake animation
  display.classList.add('text-red-500', 'animate-shake');
  
  setTimeout(() => {
    display.classList.remove('text-red-500', 'animate-shake');
  }, 500);
};

// Function to calculate the result via the API
const calculateResult = () => {
  const expressionForAPI = prepareExpressionForAPI(currentExpression);
  console.log("Expression sent to API:", expressionForAPI);
  
  fetch('http://127.0.0.1:5000/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression: expressionForAPI })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("API Response:", data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    currentExpression = formatNumber(data.result);
    updateDisplay();
  })
  .catch(error => {
    handleCalculationError(error.message);
  });
};

// Function to handle button clicks
const handleButtonClick = (value) => {
  console.log("Button clicked:", value);
  
  switch (value) {
    case ACTIONS.EQUALS:
      calculateResult();
      break;
      
    case ACTIONS.AC:
      // Simple function for AC: reset the expression
      currentExpression = '0';
      break;
      
    case ACTIONS.BACKSPACE:
      // Simple function to delete one character
      currentExpression = currentExpression.length === 1 ? '0' : currentExpression.slice(0, -1);
      break;
      
    case ACTIONS.TOGGLE_SIGN:
      currentExpression = toggleNumberSign(currentExpression);
      break;
      
    case ACTIONS.PERCENT:
      const lastNumber = extractLastNumber(currentExpression);
      if (lastNumber) {
        const percentValue = lastNumber / 100;
        currentExpression = replaceLastNumber(currentExpression, percentValue);
      }
      break;
      
    default:
      // For digits and operators
      if (currentExpression === '0') {
        currentExpression = value;
      } else {
        currentExpression += value;
        
        // Visual indication for long expressions
        if (currentExpression.length >= 20) {
          display.classList.add('text-amber-400');
          setTimeout(() => {
            display.classList.remove('text-amber-400');
          }, 300);
        }
      }
  }
  
  // Update the display
  updateDisplay();
};

// Add an event listener to each button
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const value = button.textContent;
    handleButtonClick(value);
  });
});

// Initialize the display
updateDisplay();