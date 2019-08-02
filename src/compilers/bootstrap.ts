import * as path from 'path';
import AgentPlugin from '../plugin';
import * as globby from 'globby';
import { RequireDefault } from '@nelts/utils';
export default async function Bootstrap(plu: AgentPlugin) {
  const cwd = plu.source;
  const files = await globby([ 
    'agent.ts', 
    'agent.js', 
    '!agent.d.ts' 
  ], { cwd });
  if (files.length) {
    const file = path.resolve(cwd, files[0]);
    const callback = RequireDefault<(plu: AgentPlugin) => Promise<any>>(file);
    if (typeof callback === 'function') {
      await callback(plu);
    }
  }
}