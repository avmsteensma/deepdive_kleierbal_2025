using UnityEngine;
using UnityEngine.InputSystem;

public class RotateKleierbal : MonoBehaviour
{
    [SerializeField] private InputActionAsset _actions;

    public InputActionAsset actions
    {
        get => _actions;
        set => _actions = value;
    }

    protected InputAction leftClickPressedInputAction { get; set; }

    protected InputAction mouseLookInputAction { get; set; }

    private bool _rotateAllowed;
    private Camera _camera;
    [SerializeField] private float _speed;
    [SerializeField] private bool _inverted;

    private void Awake()
    {
        _camera = Camera.main;
        InitializeInputSystem();
    }

    private void Start()
    {
        
    }

    private void Update()
    {
        if (!_rotateAllowed) 
        {
            return;
        }

        Vector2 MouseDelta = GetMouseLookInput();

        MouseDelta *= _speed * Time.deltaTime;

        transform.Rotate(Vector3.up * (_inverted ? 1 : -1), MouseDelta.x, Space.World);
        transform.Rotate(Vector3.right * (_inverted ? -1 : 1), MouseDelta.y, Space.World);
    }

    private void InitializeInputSystem()
    {
        leftClickPressedInputAction = actions.FindAction("Left Click");
        if (leftClickPressedInputAction != null )
        {
            leftClickPressedInputAction.started += OnLeftClickPressed;
            leftClickPressedInputAction.performed += OnLeftClickPressed;
            leftClickPressedInputAction.canceled += OnLeftClickPressed;
        }

        mouseLookInputAction = actions.FindAction("Mouse Look");

        actions.Enable();
    }

    protected virtual void OnLeftClickPressed(InputAction.CallbackContext context)
    {
        if (context.started || context.performed)
        {
            if (IsMouseOverObject())
            {
                _rotateAllowed = true;
            }
        }
        else if (context.canceled)
        {
            _rotateAllowed = false;
        }
    }

    private bool IsMouseOverObject()
    {
        Ray ray = _camera.ScreenPointToRay(Mouse.current.position.ReadValue());
        if (Physics.Raycast(ray, out RaycastHit hit))
        {
            // kijkt of we DIT voorwerp raken
            return hit.transform == transform;
        }
        return false;
    }

    protected virtual Vector2 GetMouseLookInput()
    {
        if (mouseLookInputAction != null)
        {
            return mouseLookInputAction.ReadValue<Vector2>();
        }
        return Vector2.zero;
    }
}
