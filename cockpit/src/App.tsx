import { AuditTail } from "./panels/AuditTail";
import { AvatarPanel } from "./panels/AvatarPanel";
import { HealthGrid } from "./panels/HealthGrid";
import { MissionConsole } from "./panels/MissionConsole";
import "./app.css";

export function App() {
  return (
    <div class="nexusmon-shell">
      <header class="nexusmon-header">
        <div class="nexusmon-title">NEXUSMON</div>
        <div class="nexusmon-subtitle">OPERATOR CONTROL PLANE - RUNTIME ACTIVE</div>
      </header>
      <main class="nexusmon-grid">
        <HealthGrid />
        <AvatarPanel />
        <MissionConsole />
        <AuditTail />
      </main>
    </div>
  );
}
