import { createSlice } from '@reduxjs/toolkit';

const MOCK_USERS = [
  // Owners
  {
    id: '1',
    firstName: 'Muhammad',
    lastName: 'Umair',
    email: 'm.umair@codevpk.com',
    password: 'Pp@s$word',
    role: 'Owner',
  },
  {
    id: '2',
    firstName: 'Shehryar',
    lastName: 'Zulfiqar',
    email: 'shehryarzulfiqar7310@gmail.com',
    password: 'Pp@s$word',
    role: 'Owner',
  },

  // Admins
  {
    id: '3',
    firstName: 'Saad',
    lastName: 'Khan',
    email: 'saadthelinuxguy@gmail.com',
    password: 'Pp@s$word',
    role: 'Admin',
  },
  {
    id: '4',
    firstName: 'Muhammad',
    lastName: 'Taha',
    email: 'm.taha7310@gmail.com',
    password: 'Pp@s$word',
    role: 'Admin',
  },

  // Pakistani team members
  {
    id: '5',
    firstName: 'Abdullah',
    lastName: 'Malik',
    email: 'abdullah.malik@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '6',
    firstName: 'Hamza',
    lastName: 'Ahmed',
    email: 'hamza.ahmed@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '7',
    firstName: 'Faisal',
    lastName: 'Sheikh',
    email: 'faisal.sheikh@demo.test',
    password: 'demo1234',
    role: 'Viewer',
  },
  {
    id: '8',
    firstName: 'Ali',
    lastName: 'Raza',
    email: 'ali.raza@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '9',
    firstName: 'Haroon',
    lastName: 'Noor',
    email: 'haroon.noor@demo.test',
    password: 'demo1234',
    role: 'Viewer',
  },
  {
    id: '10',
    firstName: 'Zain',
    lastName: 'Hussain',
    email: 'zain.hussain@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '11',
    firstName: 'Muneeb',
    lastName: 'Iqbal',
    email: 'muneeb.iqbal@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '12',
    firstName: 'Bilal',
    lastName: 'Siddiqui',
    email: 'bilal.siddiqui@demo.test',
    password: 'demo1234',
    role: 'Viewer',
  },
  {
    id: '13',
    firstName: 'Salman',
    lastName: 'Yousaf',
    email: 'salman.yousaf@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '14',
    firstName: 'Danish',
    lastName: 'Farooq',
    email: 'danish.farooq@demo.test',
    password: 'demo1234',
    role: 'Viewer',
  },

  // American team members
  {
    id: '15',
    firstName: 'Alex',
    lastName: 'Chen',
    email: 'alex.chen@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '16',
    firstName: 'Samuel',
    lastName: 'Miller',
    email: 'samuel.miller@demo.test',
    password: 'demo1234',
    role: 'Viewer',
  },
  {
    id: '17',
    firstName: 'Jordan',
    lastName: 'Brooks',
    email: 'jordan.brooks@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '18',
    firstName: 'Eric',
    lastName: 'Davis',
    email: 'eric.davis@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '19',
    firstName: 'Noah',
    lastName: 'Wilson',
    email: 'noah.wilson@demo.test',
    password: 'demo1234',
    role: 'Viewer',
  },
  {
    id: '20',
    firstName: 'Owen',
    lastName: 'Martinez',
    email: 'owen.martinez@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '21',
    firstName: 'Ethan',
    lastName: 'Taylor',
    email: 'ethan.taylor@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '22',
    firstName: 'Michael',
    lastName: 'Anderson',
    email: 'michael.anderson@demo.test',
    password: 'demo1234',
    role: 'Viewer',
  },
  {
    id: '23',
    firstName: 'Liam',
    lastName: 'Thompson',
    email: 'liam.thompson@demo.test',
    password: 'demo1234',
    role: 'Member',
  },
  {
    id: '24',
    firstName: 'Steven',
    lastName: 'Clark',
    email: 'steven.clark@demo.test',
    password: 'demo1234',
    role: 'Viewer',
  },
];



const getStoredSession = () => {
  try {
    const session = localStorage.getItem('workspace_session');
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
};

const getStoredUsers = () => {
  try {
    const users = localStorage.getItem('workspace_users');
    const parsed = users ? JSON.parse(users) : [];

    const mockEmails = new Set(MOCK_USERS.map((user) => user.email));
    const retiredDemoEmails = new Set(['umair@codevpk.com']);

    const localOnlyUsers = parsed.filter(
      (user) =>
        !mockEmails.has(user.email) &&
        !retiredDemoEmails.has(user.email)
    );

    return [...MOCK_USERS, ...localOnlyUsers];
  } catch {
    return MOCK_USERS;
  }
};

const initialState = {
  user: getStoredSession(),
  isAuthenticated: !!getStoredSession(),
  users: getStoredUsers(),
  error: null,
};

// Testing convenience: print every available login (mock + anyone who's
// signed up locally) to the console so you can log in as any of them
// without memorizing credentials. Dev-only — stripped from a prod build.
if (import.meta.env.DEV) {
  console.log('%cAvailable test logins:', 'font-weight: bold; font-size: 13px;');
  console.table(
    initialState.users.map(({ firstName, lastName, email, password, role }) => ({
      name: `${firstName} ${lastName}`,
      email,
      password,
      role,
    }))
  );
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('workspace_session', JSON.stringify(action.payload));
    },

    loginFailure: (state, action) => {
      state.error = action.payload;
    },

    signupSuccess: (state, action) => {
      const newUser = {
        ...action.payload,
        id: crypto.randomUUID(),
      };

      state.users.push(newUser);
      state.user = newUser;
      state.isAuthenticated = true;
      state.error = null;

      localStorage.setItem('workspace_users', JSON.stringify(state.users));
      localStorage.setItem('workspace_session', JSON.stringify(newUser));
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('workspace_session');
    },

    switchUser: (state, action) => {
      const target = state.users.find(
        (user) => user.id === action.payload
      );

      if (target) {
        state.user = target;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('workspace_session', JSON.stringify(target));
      }
    },

    updateProfile: (state, action) => {
      const updated = {
        ...state.user,
        ...action.payload,
      };

      state.user = updated;
      state.users = state.users.map((user) =>
        user.id === updated.id ? updated : user
      );

      localStorage.setItem('workspace_session', JSON.stringify(updated));
      localStorage.setItem('workspace_users', JSON.stringify(state.users));
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginSuccess,
  loginFailure,
  signupSuccess,
  logout,
  switchUser,
  updateProfile,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;