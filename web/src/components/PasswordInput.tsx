import { useAtom } from 'jotai';
import { useCallback, useState } from 'react';
import { $password, $passwordInvalid, fetchAPI } from '../store/auth';

export const PasswordInput = () => {
  const [visible, setVisible] = useAtom($passwordInvalid);
  const [password, setPassword] = useAtom($password);

  const [validating, setValidating] = useState(false);
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidating(true);
    fetchAPI('/api/list')
      .then(() => {
        window.dispatchEvent(new Event('records-updated'));
        setVisible(false);
        setValidating(false);
      })
      .catch(() => {
        setValidating(false);
      });
  }, []);

  return (
    !!visible && (
      <div className="fixed z-50 inset-0 bg-gray/60 flex items-center justify-center p-8">
        <form className="bg-white rounded-lg p-4 max-w-md w-full" onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">Password required</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="block w-full rounded-md border-1 border-solid border-gray-300 shadow-sm focus:border-brand-6 p-2 sm:text-sm outline-0"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" disabled={validating}>
              {validating ? 'Validating...' : 'OK'}
            </button>
          </div>
        </form>
      </div>
    )
  );
};
