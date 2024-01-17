import {
    useLocation,
    useNavigate,
    useParams
  } from "react-router-dom";

// Define a higher-order component (HOC) that injects router props into a component
export const withRouter = (Component) =>  {
  function ComponentWithRouterProp(props) {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();
    
    // Render the original component with its original props and additional router props
    return (
      <Component
        {...props}
        router={{ location, navigate, params }}
      />
    );
  }

  // Return the new component
  return ComponentWithRouterProp;
}