import { Link, useLocation } from "react-router-dom";

function Navbar() {

    const location = useLocation();

    return (

        <div className="navbar">

            <h2>

                Chess Tournament Manager

            </h2>

            <div className="nav-links">

                <Link

                    to="/"

                    className={location.pathname === "/" ? "active" : ""}

                >

                    Home

                </Link>

                <Link

                    to="/players"

                    className={location.pathname === "/players" ? "active" : ""}

                >

                    Players

                </Link>

                <Link

                    to="/tournaments"

                    className={location.pathname === "/tournaments" ? "active" : ""}

                >

                    Tournaments

                </Link>

            </div>

        </div>

    );

}

export default Navbar;