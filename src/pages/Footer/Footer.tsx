import { useLanguage } from "../../context/languageContext";
import { getLanguageByShortName, getLanguageList } from "../../models/language";
import css from "./Footer.module.scss";

const Footer = () => {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className={css["footer"]}>
      <select
        className="form-select small"
        value={language?.shortName}
        onChange={(e) => {
          if (changeLanguage) {
            changeLanguage(getLanguageByShortName(e.currentTarget.value));
          }
        }}
      >
        {getLanguageList().map((item) => (
          <option key={item.shortName} value={item.shortName}>
            {item.longName}
          </option>
        ))}
      </select>
      Rafael Hideki Hosaka © 2024 ShareMe {process.env.REACT_APP_VERSION}
    </div>
  );
};

export default Footer;
