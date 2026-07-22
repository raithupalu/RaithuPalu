export const calculateAge = (birthDate) => {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return '—';
  const today = new Date();
  const diffMs = today - birth;
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  const years = Math.floor(diffYears);
  const months = Math.floor((diffYears - years) * 12);
  
  if (years === 0) {
    return `${months} months`;
  }
  return `${years}y ${months}m`;
};

export const formatDate = (date) => {
  if (!date) return '—';
  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) return '—';
  return dateObj.toLocaleDateString();
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) return '—';
  return dateObj.toLocaleString();
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-700';
    case 'pregnant': return 'bg-rose-100 text-rose-700';
    case 'dry': return 'bg-amber-100 text-amber-700';
    case 'sold': return 'bg-slate-100 text-slate-600';
    case 'deceased': return 'bg-slate-100 text-slate-500';
    default: return 'bg-slate-100 text-slate-600';
  }
};