import PropTypes from "prop-types";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";

function IlacimNeredeQueryClientProvider({ children }) {
  const auth = useAuth();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        if (error.response?.status === 401) {
          auth.removeUser();
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error.response?.status === 401) {
          auth.removeUser();
        }
      },
    }),
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

IlacimNeredeQueryClientProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default IlacimNeredeQueryClientProvider;
