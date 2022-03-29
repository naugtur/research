module.exports = findInstall;

function findInstall(pkg) {
    const { postinstall, preinstall, install } = (pkg.scripts || {})
    if (postinstall || preinstall || install) {
        return pkg.name
    }
}