    function run() {
        const code = document.getElementById('textArea').value;
        const consoleOutput = document.getElementById('textAreaConsole');
        consoleOutput.value = ''; // Clear previous output
  
        const originalConsoleLog = console.log;
        console.log = function(message) {
          consoleOutput.value += message + '\n';
        };
  
        try {
          eval(code);
        } catch (error) {
          consoleOutput.value += 'Error: ' + error.message + '\n';
        }
  
        console.log = originalConsoleLog; // Restore original console.log
      }
  
      function sterge() {
        document.getElementById('textAreaConsole').value = '';
      }