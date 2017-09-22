define(['connector', 'utils'], function(conn, utils) {

    var _project = undefined;
    var _key = 'dashingsoft.pyarmor.project.name';
    var _projectList = document.getElementById('project-manage-list');

    function loadProject(data) {
        document.getElementById('input_project_name').value = data.name;
        document.getElementById('input_project_title').value = data.title;
        document.getElementById('input_project_capsule').value = data.capsule;
        document.getElementById('input_project_path').value = data.path;
        document.getElementById('input_project_files').value = data.files;
        document.getElementById('input_project_scripts').value = data.scripts;

        document.getElementById('input_project_target').value = data.target;

        document.getElementById('check_bind_harddisk').value = '';
        document.getElementById('check_expired_date').value = '';
        document.getElementById('input_bind_harddisk').value = '';
        document.getElementById('input_expired_date').value = '';
        document.getElementById('input_license_rcode').value = '';

        var default_license = data.default_license;
        var options = ['<option value=""' + (default_license === '' ? ' selected' : '') +
                       '>Run in any machine and never expired</option>'];
        for (var i=0; i < data.licenses.length; i++) {
            var title = data.licenses[i].title;
            var filename = data.licenses[i].filename;
            options.push('<option value="' + filename + '"' +
                         (default_license === filename ? ' selected' : '') + '>' +
                         title + '(' + filename + ')</option>');
        }
        document.getElementById('input_project_licenses').innerHTML = options.join('');
        document.getElementById('input_project_default_license').innerHTML = options.join('');

        _project = data;
        window.localStorage.setItem(_key, data.name);
    }

    function _updateProject() {
        _project.name = document.getElementById('input_project_name').value;
        _project.title = document.getElementById('input_project_title').value;
        _project.capsule = document.getElementById('input_project_capsule').value;
        _project.path = document.getElementById('input_project_path').value;
        _project.files = document.getElementById('input_project_files').value;
        _project.scripts = document.getElementById('input_project_scripts').value;
        _project.target = document.getElementById('input_project_target').value;
        _project.default_license  = document.getElementById('input_project_default_license').value;
    }

    function saveProject() {
        var _callback = function (response) {
            if (response.errcode) {
                utils.showMessage(response.result);
                return ;
            }
            utils.showMessage(response.result);
        }

        _updateProject();
        conn.updateProject(_project, _callback);
    }

    function buildProject() {
        var _callback = function (response) {
            if (response.errcode) {
                utils.showMessage(response.result);
                return ;
            }
            utils.showMessage(response.result + '<p> Output path: ' + _project.output);
        }

        _updateProject();
        conn.buildProject(_project, _callback);
    }

    function openProjectModal() {
        var _callback = function (response) {
            if (response.errcode) {
                utils.showMessage(response.result);
                return ;
            }
            var result = response.result;
            var options = []
            for (var i = 0; i < result.length; i ++)
                options.push('<option value="' + result[i].name + '">' + result[i].title + '</option>');
            _projectList.innerHTML = options.join('');
            $('#project-manage-modal').modal('show');
        }
        conn.queryProject({}, _callback);
    }

    function openProject() {
        var _callback = function (response) {
            if (response.errcode) {
                utils.showMessage(response.result);
                return ;
            }
            result = response.result;
            loadProject(result.project);
        }
        var index = _projectList.selectedIndex;
        if (index !== -1)
            conn.queryProject({name: _projectList.value}, _callback);
        $('#project-manage-modal').modal('hide');
    }

    function removeProject() {
        var _callback = function (response) {
            if (response.errcode) {
                utils.showMessage(response.result);
                return ;
            }
            _projectList.remove(index);
            utils.showMessage(response.result);
        }
        var index = _projectList.selectedIndex;
        if (index !== -1)
            conn.removeProject({name: _projectList.value}, _callback);
    }

    function newLicense() {
        var _callback = function (response) {
            if (response.errcode) {
                utils.showMessage(response.result);
                return ;
            }
            var result = response.result;
            var opt = document.createElement("option");
            opt.text = result.title + ' (' + result.filename + ')';
            opt.value = result.filename;
            document.getElementById('input_project_licenses').add(opt);
            utils.showMessage('New license ' + result.title + ' OK.');
        }

        var args = {};
        var value;
        if (document.getElementById('check_bind_harddisk').checked) {
            value = document.getElementById('input_bind_harddisk').value;
            if (value == '') {
                utils.showMessage('Serial number of harddisk is requried.');
                document.getElementById('input_bind_harddisk').focus();
                return;
            }
            args.hdinfo = value;
        }
        if (document.getElementById('check_expired_date').checked) {
            value = document.getElementById('input_expired_date').value;
            if (value == '') {
                utils.showMessage('Expired date is required.');
                document.getElementById('input_expired_date').focus();
                return;
            }
            args.expired = value;
        }
        if (args.hdinfo === undefined && args.expired === undefined) {
            args.rcode = document.getElementById('input_license_rcode').value;
            if (args.rcode === '') {
                utils.showMessage('All input is blank, at least one is required.');
                return;
            }
        }

        conn.newLicense(args, _callback);
    }

    function removeLicense(e) {
        var licenseList = document.getElementById('input_project_licenses');
        var _callback = function (response) {
            if (response.errcode) {
                utils.showMessage(response.result);
                return ;
            }
            licenseList.remove(index);
            utils.showMessage(response.result);

            var element = document.getElementById('input_project_default_license');
            if (index == element.selectedIndex)
                element.selectedIndex = 0;
        }
        var index = licenseList.selectedIndex;
        if (index > 0)
            conn.removeLicense({name: licenseList.value}, _callback);
        else if (index === 0)
            utils.showMessage('Default license can not be removed.');
    }

    // Load default project when webapp start
    function initProject() {
        var _callback = function (response) {
            if (response.errcode) {
                utils.showMessage(response.result);
                return ;
            }
            result = response.result;
            loadProject(result.project);
        }

        var name = window.localStorage.getItem(_key);
        name === undefined || name === null || name === ''
            ? conn.newProject(_callback)
            : conn.queryProject({ name: name }, _callback);
    }

    return {
        currentProject: _project,

        loadProject: loadProject,
        initProject: initProject,

        newProject: function () {
            conn.newProject(_callback);
        },

        openProjectModal: openProjectModal,
        openProject: openProject,
        saveProject: saveProject,
        buildProject: buildProject,
        removeProject: removeProject,
        newLicense: newLicense,
        removeLicense: removeLicense,
    }

});