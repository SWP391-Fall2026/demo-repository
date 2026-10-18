import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { identityApi } from "../api/identity.api";
export default function RoleCatalogPage() {
  return (
    <ResourcePage
      title="Danh mục quyền theo vai trò"
      description=""
      load={identityApi.roles}
    ></ResourcePage>
  );
}
