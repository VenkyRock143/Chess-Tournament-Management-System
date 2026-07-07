function Alert(props) {

    let className = "alert";

    if (props.type === "success") {

        className = "alert alert-success";

    } else {

        className = "alert alert-error";

    }

    return (

        <p className={className}>

            {props.children}

        </p>

    );

}

export default Alert;