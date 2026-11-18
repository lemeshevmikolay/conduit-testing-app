import { Outlet } from "react-router-dom";
import BannerContainer from "../components/BannerContainer";
import ContainerRow from "../components/ContainerRow";
import FeedToggler from "../components/FeedToggler";
import { useAuth } from "../context/AuthContext";
import FeedProvider from "../context/FeedContext";
import PopularTags from "./../components/PopularTags";

const commit = __CONDUIT_COMMIT__;

function Home() {
  const { isAuth } = useAuth();

  return (
    <div className="home-page">
      {!isAuth && (
        <BannerContainer>
          <h1 className="logo-font">Conduit</h1>
          {commit.subject && (
            <p className="home-commit" title={`${commit.subject} (${commit.shortHash})`}>
              <span>{commit.subject}</span>
              {commit.shortHash && <code>{commit.shortHash}</code>}
              {commit.date && (
                <time dateTime={commit.date}>
                  {new Intl.DateTimeFormat("uk-UA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(commit.date))}
                </time>
              )}
            </p>
          )}
          <p>Українська спільнота про технології, продукти й розробку.</p>
        </BannerContainer>
      )}
      <ContainerRow type="page">
        <FeedProvider>
          <div className="col-md-9">
            <FeedToggler />
            <Outlet />
          </div>

          <PopularTags />
        </FeedProvider>
      </ContainerRow>
    </div>
  );
}

export default Home;
