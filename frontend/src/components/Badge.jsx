function Badge(props) {
  let text = props.status;

  let className = "badge";

  if (props.status === "active") {
    text = "Active";
    className += " badge-active";
  }

  if (props.status === "pending") {
    text = "Pending";
    className += " badge-pending";
  }

  if (props.status === "completed") {
    text = "Completed";
    className += " badge-completed";
  }

  if (props.status === "disqualified") {
    text = "Disqualified";
    className += " badge-disqualified";
  }

  return <span className={className}>{text}</span>;
}

export default Badge;
