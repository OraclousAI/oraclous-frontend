// Connections (Settings § "Identity and credentials") — the credential roster and the add flow now
// live on the dedicated Connections page (/app/connections). This card just links there; the old
// in-Settings BYOM add form was retired once the Connections "Add a credential" sheet reached parity
// (Connections journey, increment 2).
import { Link } from 'react-router-dom';

export function ConnectionsSection() {
  return (
    <section className="card" aria-label="Connections">
      <div className="card-head">
        <div className="h">
          <h2>Connections</h2>
          <span className="sub">Your model keys and tool credentials</span>
        </div>
      </div>
      <div className="card-body">
        <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
          Add and manage your credentials — model keys, API keys, and connection strings — on the{' '}
          <Link to="/app/connections">Connections page</Link>.
        </p>
      </div>
    </section>
  );
}
