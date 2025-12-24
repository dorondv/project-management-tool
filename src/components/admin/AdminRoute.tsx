import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { state } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.user) {
      navigate('/');
      return;
    }

    if (state.user.role !== 'admin') {
      navigate('/');
      toast.error('Admin access required');
    }
  }, [state.user, navigate]);

  if (!state.user || state.user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}

