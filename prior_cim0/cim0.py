"""CIM-0: deterministic typed micro-performer graph and chromatic field prototype.
Standard-library only. This is a research seed, not a browser renderer.
"""
from dataclasses import dataclass
import colorsys, hashlib, json, math, random
from typing import Callable

@dataclass(frozen=True)
class Performer:
    name: str
    consumes: str
    produces: str
    fn: Callable

REGISTRY = {
    'identity': Performer('identity', 'seed', 'identity', lambda x: {'identity': x['seed']}),
    'auth_form': Performer('auth_form', 'identity', 'form', lambda x: {'fields': ['email', 'password'], 'purpose': x['purpose']}),
    'verification': Performer('verification', 'identity', 'message', lambda x: {'channel': 'email', 'template': 'verification'}),
    'refund': Performer('refund', 'identity', 'workflow', lambda x: {'steps': ['validate', 'authorize', 'issue', 'receipt']}),
}

def compose(first: Performer, second: Performer):
    if first.produces != second.consumes:
        raise TypeError(f'incompatible: {first.produces} -> {second.consumes}')
    return lambda x: second.fn(first.fn(x))

def chromatic_field(seed: int, x: float, y: float, t: float, state: float):
    """Deterministic illustrative RGB field; not perceptually uniform or WCAG-certified."""
    rng = random.Random(seed)
    base = rng.random()
    hue = (base + 0.10*math.sin(2*math.pi*(x + t)) + 0.08*y + 0.07*state) % 1
    sat = min(0.75, 0.45 + 0.15*abs(math.sin(math.pi*y)))
    light = 0.55 + 0.08*math.cos(2*math.pi*(t+x))
    rgb = colorsys.hls_to_rgb(hue, light, sat)
    return '#'+''.join(f'{round(v*255):02x}' for v in rgb)

def generate(seed: int):
    rng = random.Random(seed)
    types = ['document', 'graph', 'spatial']
    layout = types[rng.randrange(len(types))]
    panels = 2 + rng.randrange(4)
    nodes = [{'id': f'n{i}', 'role': ['navigation','content','action'][i%3],
              'color': chromatic_field(seed, i/max(1,panels-1), 0.5, 0, 0)} for i in range(panels)]
    return {'seed': seed, 'layout': layout, 'nodes': nodes,
            'edges': [[f'n{i}',f'n{i+1}'] for i in range(panels-1)]}

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',',':')).encode()).hexdigest()

def run(n=1000):
    artifacts = [generate(i) for i in range(n)]
    hashes = [digest(x) for x in artifacts]
    return {'generated': n, 'unique_structural_hashes': len(set(hashes)),
            'layout_counts': {k: sum(a['layout']==k for a in artifacts) for k in ['document','graph','spatial']},
            'replay_deterministic': all(digest(generate(i)) == hashes[i] for i in range(n)),
            'type_guard_rejects_invalid': invalid_guard_test(),
            'note': 'Unique hashes measure structural serialization, not perceptual novelty or usability.'}

def invalid_guard_test():
    try:
        compose(REGISTRY['auth_form'], REGISTRY['refund'])
    except TypeError:
        return True
    return False

if __name__ == '__main__':
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('--count', type=int, default=1000)
    args=parser.parse_args()
    print(json.dumps(run(args.count), indent=2))
