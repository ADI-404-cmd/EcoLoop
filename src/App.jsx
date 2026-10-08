import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ArrowRight, RotateCw } from 'lucide-react';
import Navbar from './components/Navbar';
import HomeModule from './components/HomeModule';
import CalculatorModule from './components/CalculatorModule';
import SubmissionModule from './components/SubmissionModule';
import CircularJourneyModule from './components/CircularJourneyModule';
import CollectionCentersModule from './components/CollectionCentersModule';
import DashboardModule from './components/DashboardModule';
import KnowledgeModule from './components/KnowledgeModule';
import ReferencesModule from './components/ReferencesModule';
import { api } from './api';

const pageMeta = {
  home: ['Overview', 'A clearer view of the circular journey.'],
  calculator: ['Impact studio', 'Explore material pathways with source-backed estimates.'],
  register: ['Register a device', 'Put a device on a traceable route to responsible recovery.'],
  journey: ['Track a device', 'Follow each custody and processing milestone.'],
  centers: ['Collection network', 'Find a responsible drop-off point near you.'],
  dashboard: ['Operations intelligence', 'Understand what is registered, collected and processed.'],
  knowledge: ['Field notes', 'Practical guidance for a more circular electronics lifecycle.'],
  references: ['Evidence library', 'Explore the sources behind EcoLoop’s methodology.'],
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [analytics, setAnalytics] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [journeyCode, setJourneyCode] = useState('');
  const [registrationFormData, setRegistrationFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const refreshOverview = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const [nextAnalytics, nextSubmissions] = await Promise.all([api.analytics(), api.submissions()]);
      setAnalytics(nextAnalytics);
      setSubmissions((nextSubmissions.submissions || []).slice(0, 6));
    } catch (error) {
      setApiError(error.message || 'EcoLoop could not connect to the service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshOverview(); }, [refreshOverview]);

  const onSubmissionCreated = useCallback(() => {
    refreshOverview();
  }, [refreshOverview]);

  const openJourney = useCallback((trackingCode) => {
    setJourneyCode(trackingCode);
    setActiveTab('journey');
  }, []);

  const onSelectDeviceForJourney = useCallback((trackingCode) => {
    setJourneyCode(trackingCode);
    setActiveTab('journey');
  }, []);

  const title = pageMeta[activeTab] || pageMeta.home;
  const renderModule = () => {
    switch (activeTab) {
      case 'calculator': return <CalculatorModule onProceedToRegister={(formData) => { setRegistrationFormData(formData); setActiveTab('register'); }} />;
      case 'register': return <SubmissionModule initialFormData={registrationFormData} onSuccessSubmit={onSubmissionCreated} onNavigateToJourney={openJourney} />;
      case 'journey': return <CircularJourneyModule selectedTrackingCode={journeyCode} submissions={submissions} />;
      case 'centers': return <CollectionCentersModule />;
      case 'dashboard': return <DashboardModule analytics={analytics} onRefresh={refreshOverview} />;
      case 'knowledge': return <KnowledgeModule setActiveTab={setActiveTab} />;
      case 'references': return <ReferencesModule />;
      default: return <HomeModule stats={analytics?.metrics} recentSubmissions={submissions} setActiveTab={setActiveTab} onSelectDeviceForJourney={onSelectDeviceForJourney} loading={loading} />;
    }
  };

  return (
    <div className="app-shell">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} stats={analytics?.metrics} />
      <main className="page-wrap">
        <div className="page-context">
          <div>
            <span className="eyebrow">ECOLOOP / {activeTab.toUpperCase()}</span>
            <h1>{title[0]}</h1>
            <p>{title[1]}</p>
          </div>
          <div className="system-state">
            <span className={`state-dot ${apiError ? 'state-dot-error' : ''}`} />
            {apiError ? 'Service needs attention' : 'Circular system'}
          </div>
        </div>

        {apiError && (
          <div className="api-alert" role="status">
            <AlertCircle size={18} />
            <div>
              <strong>Live data is temporarily unavailable</strong>
              <span>{apiError} Displayed figures are not replaced with estimates.</span>
            </div>
            <button className="icon-button" onClick={refreshOverview} aria-label="Retry connection">
              <RotateCw size={17} />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderModule()}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="app-footer">
        <span><strong>EcoLoop</strong> · From E-Waste to New Value.</span>
        <span>Source-backed circularity intelligence <ArrowRight size={13} /> 2026</span>
      </footer>
    </div>
  );
}
