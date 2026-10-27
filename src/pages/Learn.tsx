import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PageHeader } from '../components/page/PageHeader';
import { Chip } from '../components/page/Chip';
import { ConceptCard } from '../components/learn/ConceptCard';
import { ConceptModal } from '../components/learn/ConceptModal';
import { concepts, type Concept } from '../data/concepts';

type CategoryFilter = 'All' | 'Python' | 'Debugging' | 'Predict output';
type DifficultyFilter = 'All' | 'Easy' | 'Medium' | 'Hard';

export default function Learn() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalConcept, setActiveModalConcept] = useState<Concept | null>(null);

  useEffect(() => {
    document.title = 'Learn — CogniCode';
  }, []);

  const filteredConcepts = useMemo(() => {
    return concepts.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'All' && item.difficulty !== selectedDifficulty) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSummary = item.summary.toLowerCase().includes(query);
        const matchesCode =
          item.buggySnippet.toLowerCase().includes(query) ||
          item.fixedSnippet.toLowerCase().includes(query);
        return matchesTitle || matchesSummary || matchesCode;
      }
      return true;
    });
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  return (
    <div className="page-shell">
      <Header />
      <main className="listing-page learn-page">
        {/* HEADER */}
        <PageHeader
          eyebrow="FOUNDATIONS"
          title="Learn"
          description="Master high-frequency Python failure modes, off-by-one errors, closure binding, and diagnostic invariants."
        />

        {/* CONTROLS BAR: SEARCH & FILTERS */}
        <div className="learn-controls-card">
          <div className="learn-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search concepts, bugs, or code patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="learn-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </button>
            )}
          </div>

          <div className="learn-filter-group">
            <div className="filter-row">
              <span className="filter-label">Category</span>
              <div className="filter-chips">
                {(['All', 'Python', 'Debugging', 'Predict output'] as CategoryFilter[]).map(
                  (cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      active={selectedCategory === cat}
                      onClick={() => setSelectedCategory(cat)}
                    />
                  )
                )}
              </div>
            </div>

            <div className="filter-row">
              <span className="filter-label">Difficulty</span>
              <div className="filter-chips">
                {(['All', 'Easy', 'Medium', 'Hard'] as DifficultyFilter[]).map((diff) => (
                  <Chip
                    key={diff}
                    label={diff}
                    active={selectedDifficulty === diff}
                    onClick={() => setSelectedDifficulty(diff)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS META */}
        <div className="learn-results-meta">
          <span className="results-count">
            Showing {filteredConcepts.length} of {concepts.length} concepts
          </span>
          {(selectedCategory !== 'All' || selectedDifficulty !== 'All' || searchQuery) && (
            <button
              type="button"
              className="reset-filters-btn"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedDifficulty('All');
                setSearchQuery('');
              }}
            >
              Reset filters
            </button>
          )}
        </div>

        {/* CONCEPTS GRID */}
        {filteredConcepts.length === 0 ? (
          <div className="learn-empty-state">
            <BookOpen size={32} className="empty-icon" />
            <h3>No matching concepts</h3>
            <p>Try searching for a different term or resetting the selected filters.</p>
          </div>
        ) : (
          <div className="learn-concepts-grid">
            {filteredConcepts.map((concept) => (
              <ConceptCard
                key={concept.id}
                concept={concept}
                onSelect={(c) => setActiveModalConcept(c)}
              />
            ))}
          </div>
        )}

        {/* MODAL DIALOG */}
        <ConceptModal
          concept={activeModalConcept}
          onClose={() => setActiveModalConcept(null)}
        />
      </main>
      <Footer />
    </div>
  );
}
