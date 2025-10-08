import MediaTracker from './MediaTracker'
import ToastProvider from './components/ToastProvider.jsx';

function App() {
  return (
    <ToastProvider>
      <MediaTracker />
    </ToastProvider>
  );
}

export default App