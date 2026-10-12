import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getDocBySlug, DOC_PAGES } from '../data/docs';
import { DocsLayout } from '../components/docs/DocsLayout';

export const DocsPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();

  // If no slug (e.g. /docs), redirect to the first doc "introduction"
  if (!slug) {
    return <Navigate to="/docs/introduction" replace />;
  }

  const page = getDocBySlug(slug);

  if (!page) {
    // If slug doesn't exist, redirect to introduction
    return <Navigate to="/docs/introduction" replace />;
  }

  return <DocsLayout page={page} />;
};
