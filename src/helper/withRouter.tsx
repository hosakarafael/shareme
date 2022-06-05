import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FunctionComponent } from "react";

export default function withRouter(Component: FunctionComponent) {
  function ComponentWithRouterProp(props: any) {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();
    return <Component {...props} router={{ location, navigate, params }} />;
  }

  return ComponentWithRouterProp;
}
