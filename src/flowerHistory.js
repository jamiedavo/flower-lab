const HISTORY_LIMIT = 100;

// Flower configurations are flat records of numbers and color strings. Copy and
// freeze them so later edits to an input object cannot change an undo snapshot.
const snapshot = (value) => Object.freeze({ ...value });

const sameConfig = (left, right) => {
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => Object.hasOwn(right, key) && Object.is(left[key], right[key]))
  );
};

export const createHistory = (initial) => ({
  past: [],
  present: snapshot(initial),
  future: [],
});

// Each commit is one complete user action. Callers group continuous gestures
// before committing, so undo restores the entire previous flower in one step.
export const historyReducer = (state, action) => {
  switch (action.type) {
    case 'commit': {
      if (sameConfig(state.present, action.value)) return state;
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: snapshot(action.value),
        future: [],
      };
    }
    case 'undo': {
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      };
    }
    case 'redo': {
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: state.future[0],
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
};
