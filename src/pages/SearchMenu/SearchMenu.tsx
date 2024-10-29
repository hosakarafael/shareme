import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useSearchParams } from "react-router-dom";
import { searchUsersContainsName } from "../../services/userService";
import PeopleResult from "../../components/SearchResult/People/PeopleResult";
import {
  getPendingFriendRequest,
  getRequestedUsers,
} from "../../services/friendService";
import _ from "lodash";
import UserProfileEntity from "../../models/userProfile";
import css from "./SearchMenu.module.scss";
import { useUser } from "../../context/userContext";
import MenuList from "../../components/MenuList/MenuList";
import MenuItem from "../../components/MenuList/MenuItem";
import { useTranslation } from "react-i18next";
import LoadingContainer from "../../components/LoadingContainer/LoadingContainer";

function SearchMenu() {
  const { t } = useTranslation();
  const { filter } = useParams();
  let [searchParams] = useSearchParams();
  let query = searchParams.get("q");
  const [result, setResult] = useState<UserProfileEntity[]>([]);
  const { user: currentUser } = useUser();
  const [loading, setLoading] = useState(true);

  const [requestedUsers, setRequestedUsers] = useState([]);
  const [pendingUsers, setPedingUsers] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
    if (!query) {
      navigate("/not-found", { replace: false });
    }
  }, []);

  useEffect(() => {
    async function filterResult() {
      setLoading(true);
      switch (filter) {
        case "people":
          if (currentUser) {
            setResult(await getPeoples());
            const { data: requested } = await getRequestedUsers(
              currentUser?.id
            );
            setRequestedUsers(requested);
            const { data: pending } = await getPendingFriendRequest(
              currentUser?.id
            );
            setPedingUsers(pending);
          }
      }
      setLoading(false);
    }
    filterResult();
  }, [filter, query]);

  const getPeoples = async () => {
    try {
      if (query) {
        const { data } = await searchUsersContainsName(query);
        return data;
      }
    } catch (ex: any) {
      if (ex.response?.status === 404) {
        return [];
      }
    }
  };

  const handleFilterSelected = (filterValue: string) => {
    navigate(`/search/${filterValue}?q=${query}`, { replace: false });
  };

  const isActive = (label: string) => {
    return label === filter ? true : false;
  };

  const renderResult = () => {
    if (result.length === 0)
      return <h1 className={css["no-result"]}>{t("SEARCH.noResult")}</h1>;
    switch (filter) {
      case "people":
        return renderPeople();
      default:
        return;
    }
  };

  const renderPeople = () => {
    return result.map((people) => (
      <PeopleResult
        key={people.id}
        people={new UserProfileEntity(people)}
        requested={_.some(requestedUsers, ["targetUserId", people.id])}
        pending={_.some(pendingUsers, ["requestingUserId", people.id])}
        ownSelf={people.id === currentUser?.id}
      />
    ));
  };

  return (
    <>
      <main className="container right center m2">
        {loading ? <LoadingContainer /> : renderResult()}
      </main>
      <div className="left-content">
        <MenuList title={t("SEARCH.header")}>
          <span className={css["search-filter"]}>{t("SEARCH.filters")}</span>
          <MenuItem active={isActive("people")}>
            <div onClick={() => handleFilterSelected("people")}>
              {t("SEARCH.people")}
            </div>
          </MenuItem>
        </MenuList>
      </div>
    </>
  );
}

export default SearchMenu;
