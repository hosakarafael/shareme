import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../../../context/userContext";
import { useBase64File } from "../../../hook/useBase64File";
import { GroupEntity } from "../../../models/group";
import { downloadGroupImage } from "../../../services/groupService";
import Spinner from "../../Spinner/Spinner";
import css from "./Group.module.scss";

interface GroupProps {
  group: GroupEntity;
}

const Group = ({ group }: GroupProps) => {
  const { t } = useTranslation();
  const { file: groupImage, setService } = useBase64File(null);
  const { user: currentUser } = useUser();

  useEffect(() => {
    setService(downloadGroupImage(group.id));
  }, [group]);

  const checkJoined = () => {
    let joined = false;
    if (currentUser) {
      if (group.admins.includes(currentUser.id)) {
        joined = true;
      }
      if (group.members.includes(currentUser.id)) {
        joined = true;
      }
    }
    return joined;
  };

  return (
    <div className={css["container"]}>
      <div className={css["cover__container"]}>
        <Spinner show={!groupImage} sizeClass="size--300">
          {group?.fileName ? (
            <img className={css["cover"]} src={groupImage} />
          ) : (
            <div className={css["cover"]} />
          )}
        </Spinner>
      </div>
      <div className={css["body"]}>
        <div>
          <div className={css["name"]}>{group.name}</div>
          <div className={css["member"]}>
            {group.admins?.length + group.members?.length > 1
              ? t("GROUP.member_plural", {
                  count: group.admins?.length + group.members?.length,
                })
              : t("GROUP.member_singular", {
                  count: group.admins?.length + group.members?.length,
                })}
          </div>
        </div>
        {checkJoined() ? (
          <button className="btn btn--primary">{t("GROUP.joined")}</button>
        ) : (
          <button className="btn btn--primary">{t("GROUP.join")}</button>
        )}
      </div>
    </div>
  );
};

export default Group;
