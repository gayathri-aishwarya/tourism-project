'use client'

import { useParams } from 'next/navigation';

export default function SimpleDynamicPage() {
  const params = useParams();
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Simple Dynamic Route Test</h1>
      <p>ID from URL: <strong>{params?.id}</strong></p>
      <pre>{JSON.stringify(params, null, 2)}</pre>
    </div>
  );
}